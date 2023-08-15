$(document).ready(function() {
    $(".map-image").click(function() {
        $("#map-selection-form input[name='map']").val(this.id);
        $("#map-selection-form").submit();
    });
});
